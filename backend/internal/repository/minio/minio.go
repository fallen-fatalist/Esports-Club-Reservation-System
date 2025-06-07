package minio

import (
	"context"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/repository"
	"io"
	"log"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var _ repository.MinioClient = (*MinioClient)(nil)

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
func (mc *MinioClient) ChangePfp(ctx context.Context, userID string, r io.Reader, objectSize int64, contentType string) error {
	_, err := mc.client.PutObject(ctx, "pfp", userID, r, objectSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

func (mc *MinioClient) GetPfpURL(ctx context.Context, userID string) (string, error) {
	// Always generate a new presigned URL
	presignedURL, err := mc.client.PresignedGetObject(ctx, "pfp", userID, time.Hour, nil)
	if err != nil {
		return "", err
	}

	return presignedURL.String(), nil
}

// DeleteFile removes a file from the bucket
func (mc *MinioClient) DeletePfp(ctx context.Context, userID string) error {
	return mc.client.RemoveObject(ctx, "pfp", userID, minio.RemoveObjectOptions{})
}
