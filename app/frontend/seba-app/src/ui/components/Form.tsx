import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import LoadingIndicator from "./LoadingIndicator";
import axios from "axios";
import api from "../../api";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Card,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { SelectChangeEvent } from "@mui/material/Select";

// Define an interface for the form data to support both login and signup
interface FormData {
  email?: string;
  username?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
}

interface FormProps {
  route: string;
  method: "login" | "register";
}

const Form: React.FC<FormProps> = ({ route, method }) => {
  // State for form
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    password: "",
    ...(method === "login"
      ? { email: "" }
      : {
          firstName: "",
          lastName: "",
          gender: "",
          dateOfBirth: "",
        }),
  });

  // State for password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Loading and navigation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Determine form title based on method
  const name = method === "login" ? "Welcome back" : "Register";

  // Separate handlers for different input types
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Handle form submission

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submissionData =
        method === "login"
          ? { email: formData.email, password: formData.password }
          : {
              email: formData.email,
              password: formData.password,
              first_name: formData.firstName,
              last_name: formData.lastName,
              gender: formData.gender,
              date_of_birth: formData.dateOfBirth,
            };

      // Submit to the specified route
      //console.log(submissionData);
      const res = await api.post(route, submissionData);
      //console.log("res:", res);
      //console.log("res.data:", res.data);

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        await login({
          email: formData.email || "",
          password: formData.password,
        });
        navigate("/");
      } else {
        //const res = await api.post(route, submissionData);
        navigate("/login");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          setError("Your credentials are wrong. Please try again");
        } else if (error.request) {
          setError("No response from server. Please try again later.");
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Card
        sx={{
          width: "100%",
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "white",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: "#000000" }}
        >
          {method === "login" ? "Welcome Back" : "Register"}
        </Typography>
        {method === "register" && (
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 3, color: "text.secondary" }}
          >
            Already a member?{" "}
            <Button href="/login" color="primary">
              Login
            </Button>
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {method === "register" && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName || ""}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName || ""}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
          )}

          {method === "register" && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Select
                  fullWidth
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleSelectChange}
                  displayEmpty
                  required
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  name="dateOfBirth"
                  label="Date of Birth"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
          )}

          <TextField
            fullWidth
            type="email"
            name="email"
            label="Email"
            value={formData.email || ""}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            type={passwordVisible ? "text" : "password"}
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility}>
                    {passwordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {loading && <LoadingIndicator />}
          {error && (
            <Typography
              sx={{
                color: "red",
                mt: 2,
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {method === "login" ? "Login" : "Register"}
          </Button>
        </Box>
      </Card>
    </Container>
  );
};

export default Form;
