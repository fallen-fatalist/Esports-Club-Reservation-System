package minio

import (
	"context"
	"esports_club_booking/internal/config"
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
	client *minio.Client
}

func NewMinioClient(cfg *config.Config) (*MinioClient, error) {
	minioClient, err := minio.New(cfg.Minio.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.Minio.AccessKey, cfg.Minio.SecretKey, ""),
		Secure: cfg.Minio.SSL,
	})
	if err != nil {
		return nil, err
	}

	client := &MinioClient{
		client: minioClient,
	}

	// Check if "pfp" bucket exists
	exist, err := client.client.BucketExists(context.Background(), "pfp")
	if err != nil {
		return nil, err
	}

	if !exist {
		// Create the bucket if it doesn't exist
		err = client.client.MakeBucket(context.Background(), "pfp", minio.MakeBucketOptions{})
		if err != nil {
			return nil, err
		}
		log.Println("Successfully created bucket 'pfp'")
	} else {
		log.Println("Bucket 'pfp' already exists")
	}

	return client, nil
}

// UploadFile uploads a file to the specified bucket
func (mc *MinioClient) UploadFile(ctx context.Context, bucketName, objectName, filePath, contentType string) error {
	_, err := mc.client.FPutObject(ctx, bucketName, objectName, filePath, minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

// GetFileURL generates a presigned URL for file access
func (mc *MinioClient) GetFileURL(ctx context.Context, objectName string) (string, error) {
	reqParams := make(map[string][]string)
	presignedURL, err := mc.client.PresignedGetObject(ctx, "pfp", objectName, 3600, reqParams) // 1 hour expiry
	if err != nil {
		return "", err
	}
	return presignedURL.String(), nil
}

// DeleteFile removes a file from the bucket
func (mc *MinioClient) DeleteFile(ctx context.Context, objectName string) error {
	return mc.client.RemoveObject(ctx, "pfp", objectName, minio.RemoveObjectOptions{})
}
