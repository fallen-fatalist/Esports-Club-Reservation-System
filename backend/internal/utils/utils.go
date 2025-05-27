package utils

func IsAnyEmpty(strs []string) bool {
	for _, str := range strs {
		if str == "" {
			return true
		}
	}
	return false
}

func In(str string, strs []string) bool {
	for _, s := range strs {
		if s == str {
			return true
		}
	}
	return false
}
