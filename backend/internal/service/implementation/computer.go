package implementation

import (
	"database/sql"
	"errors"
	"esports_club_booking/internal/entities"
	"esports_club_booking/internal/repository"
	"esports_club_booking/internal/service"
	"log"
	"log/slog"
	"slices"
)

// Errors
var (
	ErrComputerNotFound = errors.New("computer does not exist")
)

type ComputerService struct {
	repository   repository.ComputerRepository
	computersMap map[int64]*entities.Computer
}

func NewComputerService(repository repository.ComputerRepository) (*ComputerService, error) {
	if repository == nil {
		log.Fatal("Nil repository provided to computer service")
	}

	s := &ComputerService{repository: repository, computersMap: make(map[int64]*entities.Computer)}
	computers, _ := s.Computers("")
	for _, computer := range computers {
		s.computersMap[computer.ID] = computer
	}

	return s, nil
}

func (s *ComputerService) ComputersMap() map[int64]*entities.Computer {
	return s.computersMap
}

func (s *ComputerService) Computers(room string) ([]*entities.Computer, error) {
	comps, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	} else if room != "" {
		if !slices.Contains(entities.Rooms, room) {
			return nil, entities.ErrInvalidRoom
		}
		res := make([]*entities.Computer, 0)
		for _, comp := range comps {
			if comp.Room == room {
				res = append(res, comp)
			}
		}
		return res, nil
	} else {
		return comps, nil
	}
}

func (s *ComputerService) GetComputer(id int64) (*entities.Computer, error) {
	if err := entities.ValidateID(id); err != nil {
		return nil, err
	}
	comp, err := s.repository.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrComputerNotFound
		}
		return nil, err
	}
	return comp, nil
}

func (s *ComputerService) CreateComputer(computer *entities.Computer) (int64, error) {
	if err := computer.Validate(); err != nil {
		return 0, err
	}
	if id, err := s.repository.Create(computer); err != nil {
		slog.Error("Unhandled error creating computer:", err)
		return 0, service.ErrUnhandledError
	} else {
		return id, nil
	}
}

func (s *ComputerService) DeleteComputer(id int64) error {
	if err := entities.ValidateID(id); err != nil {
		return err
	}

	RowsAffected, err := s.repository.Delete(id)
	if err != nil {
		return err
	} else if RowsAffected == 0 {
		return ErrComputerNotFound
	}
	return nil
}

func (s *ComputerService) GetAllComputerStatuses() ([]*entities.ComputerStatus, error) {
	comps, err := s.Computers("")
	if err != nil {
		return nil, err
	}

	statuses := make([]*entities.ComputerStatus, len(comps))

	for idx, comp := range comps {
		statuses[idx] = &entities.ComputerStatus{
			ID:        comp.ID,
			Status:    comp.Status,
			UpdatedAt: comp.UpdatedAt,
		}
	}
	return statuses, nil
}

func (s *ComputerService) GetComputerStatus(id int64) (*entities.ComputerStatus, error) {
	if err := entities.ValidateID(id); err != nil {
		return nil, err
	}

	comp, err := s.repository.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrComputerNotFound
		}
		return nil, err
	}

	status := &entities.ComputerStatus{
		ID:        comp.ID,
		Status:    comp.Status,
		UpdatedAt: comp.UpdatedAt,
	}

	return status, nil
}
