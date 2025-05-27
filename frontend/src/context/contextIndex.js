// context/contextIndex.js
import { createContext } from 'react';

export const AuthContext = createContext({
  isAuth: false,
  setIsAuth: () => {},
  userRole: null,
  setUserRole: () => {},
  isAdmin: () => false,
  login: async () => {},
  logout: async () => {},
  handleAuthError: () => {},
  showModal: () => {},
  modalVisible: false,
  setModalVisible: () => {},
  modalContent: { title: "", message: "" }
}); 