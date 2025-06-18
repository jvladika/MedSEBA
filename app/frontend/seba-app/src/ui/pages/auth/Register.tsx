import React from "react";
import Form from "../../components/Form";
import { Box } from "@mui/material";

const Register = () => {
  return (
    <Box
      sx={{
        paddingTop: "50px",
        backgroundColor: "white",
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Form route="/api/user/register/" method="register" />;
    </Box>
  );
};

export default Register;
