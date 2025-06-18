export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user?: {
    email: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;
    number_questions: number;
  };
  sidebarOpen?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
