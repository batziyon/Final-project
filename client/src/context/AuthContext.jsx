import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      localStorage.removeItem("user");
      setUser(null);
      return;
    }

    const validateSession = async () => {
      try {
        const res = await api.get('/auth/me');
        const freshUser = {
          ...storedUser,
          role: res.data.role,
          bio: res.data.bio,
          profile_image: res.data.profile_image,
          skills: res.data.skills,
          is_active: res.data.is_active,
        };
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (error) {
        if (error.response?.status === 403) {
          // משתמש חסום - עדכן state בלי למחוק token
          const blockedUser = { ...storedUser, is_active: 0 };
          setUser(blockedUser);
          localStorage.setItem("user", JSON.stringify(blockedUser));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    };

    validateSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);