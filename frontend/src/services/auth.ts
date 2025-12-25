import api from "./api";

export const login = async (email: string, password: string) => {
    const response = await api.post("/login", { email, password });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
};

export const register = async (name: string, email: string, password: string) => {
    const response = await api.post("/register", { name, email, password, password_confirmation: password });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
};

export const update = async (name: string, email: string, password: string) => {
    const response = await api.put("/user/update", { name, email, password, password_confirmation: password });
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
};

export const logout = async () => {
    const response = await api.post("/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export const getCurrentUser = async (): Promise<JSON | null> => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

export const getToken = (): string | null => {
    return localStorage.getItem("token");
}