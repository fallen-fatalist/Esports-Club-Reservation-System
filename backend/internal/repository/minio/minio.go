package minio

import "github.com/minio/minio-go/v7"

type MinioClient struct {
	client minio.Client
}
