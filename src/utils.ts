import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

/**
 * Upload a PNG buffer to S3, invalidate CloudFront cache, and return the CDN URL.
 *
 * Required env vars: PUBLIC_BUCKET_NAME, CDN_URL, AWS_REGION (optional, defaults to eu-central-1)
 * Optional env var: CDN_DISTRIBUTION_ID (for CloudFront cache invalidation)
 */
export async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  const region = process.env.AWS_REGION || 'eu-central-1';
  const bucket = process.env.PUBLIC_BUCKET_NAME;
  const cdnUrl = process.env.CDN_URL;

  if (!bucket || !cdnUrl) {
    throw new Error(
      'Missing required environment variables: PUBLIC_BUCKET_NAME and CDN_URL must be set',
    );
  }

  const s3 = new S3Client({ region });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000',
    }),
  );

  const distributionId = process.env.CDN_DISTRIBUTION_ID;
  if (distributionId) {
    const cloudfront = new CloudFrontClient({ region });
    await cloudfront
      .send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: `${key}-${Date.now()}`,
            Paths: { Quantity: 1, Items: [`/${key}`] },
          },
        }),
      )
      .catch(err => console.warn('[OG Image] CloudFront invalidation failed:', err.message));
  }

  return `${cdnUrl}/${key}`;
}
