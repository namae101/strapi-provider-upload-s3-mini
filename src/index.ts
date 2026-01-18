import type { Readable } from "node:stream";
import { S3mini } from "s3mini";

interface StrapiFile {
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  path?: string;
  getStream: () => Readable;
  stream?: Readable;
  buffer?: Buffer;
}

export interface InitOptions {
  key: string;
  secret: string;
  endpoint: string;
  region: string;
  bucket: string;
  directory?: string;
  cdnEndpoint?: string;
  s3Options?: {
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  [key: string]: any;
}


const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

export default {
  init(config: InitOptions) {
    const key = config.key;
    const secret = config.secret;
    const bucket = config.bucket || config.space;
    const { endpoint, region, directory, cdnEndpoint } = config;

    // Ensure endpoint includes the bucket name as a subdomain if not already present
    // s3mini often works better with this format for DigitalOcean/Cloudflare
    let finalEndpoint = endpoint;
    try {
      if (bucket && !endpoint.includes(bucket)) {
        const url = new URL(endpoint);
        // Avoid double bucket prefix if it's already there or if it's a generic s3 endpoint
        if (!url.host.startsWith(`${bucket}.`)) {
          finalEndpoint = `${url.protocol}//${bucket}.${url.host}${url.pathname}`;
        }
      }
    } catch (e) {
      // fallback to original endpoint if URL parsing fails
    }

    const s3 = new S3mini({
      accessKeyId: key,
      secretAccessKey: secret,
      endpoint: finalEndpoint,
      region,
    });

    const filePrefix = directory ? `${directory.replace(/\/+$/, '')}/` : '';

    const getFileKey = (file: StrapiFile) => {
      const path = file.path ? `${file.path}/` : '';
      return `${filePrefix}${path}${file.hash}${file.ext}`;
    };

    const getUrl = (key: string) => {
      if (cdnEndpoint) {
        return `${cdnEndpoint.replace(/\/$/, "")}/${key}`;
      }
      const host = endpoint.replace(/^https?:\/\//, "");
      return `https://${bucket}.${host}/${key}`;
    };

    const upload = async (file: StrapiFile) => {
      const key = getFileKey(file);

      let content: Buffer;
      if (file.buffer) {
        content = file.buffer;
      } else if (file.stream) {
        content = await streamToBuffer(file.stream);
      } else if (file.getStream) {
        content = await streamToBuffer(file.getStream());
      } else {
        throw new Error("File buffer or stream is missing");
      }

      await s3.putObject(key, content, file.mime, undefined, {
        "x-amz-acl": "public-read",
      });
      file.url = getUrl(key);
    };

    return {
      upload(file: StrapiFile) {
        return upload(file);
      },
      uploadStream(file: StrapiFile) {
        return upload(file);
      },
      async delete(file: StrapiFile) {
        const key = getFileKey(file);
        try {
          await s3.deleteObject(key);
        } catch (error) {
          // Strapi usually expects delete to be silent if file not found
        }
      },
      async check(file: StrapiFile) {
        const key = getFileKey(file);
        try {
          return await s3.objectExists(key);
        } catch (error) {
          return false;
        }
      },
    };
  },
};
