import Form from "../../components/Form";
import { Box } from "@mui/material";

const Login = () => {
  return (
    <Box
      sx={{
        backgroundColor: "white",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Form route="/api/token/" method="login" />
    </Box>
  );
};

export default Login;
