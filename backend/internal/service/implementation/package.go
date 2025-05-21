package implementation

import (
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"log"
	"log/slog"
)

type PackageService struct {
	packages   []*entities.Package
	packageMap map[int64]*entities.Package
	repository repository.PackageRepository
}

func NewPackageService(repository repository.PackageRepository) (*PackageService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to package service")
	}

	service := &PackageService{
		repository: repository,
	}

	packages, err := service.Packages()
	if err != nil {
		slog.Error("Error fetching packages:", slog.String("error", err.Error()))
	}

	packageMap := service.PackagesMap()

	if len(packageMap) != len(packages) {
		slog.Error("Packages map does not match packages list", slog.Int("packages", len(packages)), slog.Int("packagesMap", len(packageMap)))
	}

	service.packageMap = packageMap
	service.packages = packages

	return service, nil
}

// TODO: improve the initial fetching of packages
func (s *PackageService) Packages() ([]*entities.Package, error) {
	if len(s.packages) > 0 {
		return s.packages, nil
	}

	packages, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}

	return packages, nil
}

func (s *PackageService) PackagesMap() map[int64]*entities.Package {
	if len(s.packageMap) > 0 {
		return s.packageMap
	} else if len(s.packages) == 0 {
		var err error
		s.packages, err = s.Packages()
		if err != nil {
			slog.Error("Error fetching package map")
			return nil
		}
	}

	packageMap := make(map[int64]*entities.Package)
	for _, pkg := range s.packages {
		packageMap[pkg.ID] = pkg
	}
	return packageMap
}

func (s *PackageService) GetPackage(int64) (*entities.Package, error) {
	return nil, nil
}

func (s *PackageService) CreatePackage(*entities.Package) (int64, error) {
	return 0, nil
}

func (s *PackageService) UpdatePackage(*entities.Package) (int64, error) {
	return 0, nil
}

func (s *PackageService) DeletePackage(int64) error {
	return nil
}
