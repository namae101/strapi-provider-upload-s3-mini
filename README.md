# Strapi Provider Upload S3mini

A lightweight S3-compatible provider for Strapi uploads, powered by the `s3mini` client. This provider is designed to work with AWS S3, DigitalOcean Spaces, Cloudflare R2, and other S3-compatible storage services.

## Installation

```bash
npm install strapi-provider-upload-s3-mini
```

## Configuration

In your Strapi project, edit or create `config/plugins.js` (or `config/plugins.ts`):

```javascript
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-s3-mini',
      providerOptions: {
        key: env('S3_ACCESS_KEY'),
        secret: env('S3_SECRET_KEY'),
        endpoint: env('S3_ENDPOINT'), // e.g. https://nyc3.digitaloceanspaces.com
        region: env('S3_REGION'),
        bucket: env('S3_BUCKET'),
        directory: env('S3_DIRECTORY'), // Optional
        cdnEndpoint: env('S3_CDN'), // Optional
      },
    },
  },
});
```

### Parameters

| Name | Description | Example |
| --- | --- | --- |
| `key` | S3 Access Key | `L3U...` |
| `secret` | S3 Secret Key | `x8k...` |
| `endpoint` | S3 Endpoint | `https://nyc3.digitaloceanspaces.com` |
| `region` | S3 Region | `nyc3` |
| `bucket` | S3 Bucket Name | `my-bucket` |
| `directory` | Optional directory in the bucket | `uploads` |
| `cdnEndpoint` | Optional CDN endpoint | `https://cdn.example.com` |

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## License

MIT
