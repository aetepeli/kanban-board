import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  Link,
} from "@chakra-ui/react";
import { useAppDispatch } from "../hooks/redux.hooks";
import { forgotPasswordUser } from "../features/auth/authSlice";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    dispatch(forgotPasswordUser(email))
      .unwrap()
      .then((res) => {
        setMessage({
          type: "success",
          text: res.message || "Reset link/code sent successfully!",
        });
        // Başarılı olursa, kod girme sayfasına yönlendir (e-posta parametresi ile birlikte)
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text: typeof err === "string" ? err : "Failed to send reset link.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Flex
      minH="100vh"
      bg="#0c0e11"
      align="center"
      justify="center"
      p={6}
      fontFamily="'Inter', sans-serif"
    >
      <Box
        w="full"
        maxW="md"
        bg="#161a1f"
        p={10}
        borderRadius="sm"
        boxShadow="2xl"
      >
        <Box mb={8}>
          <Heading
            fontFamily="'Manrope', sans-serif"
            fontSize="xl"
            fontWeight="bold"
            color="#e0e6f1"
          >
            Forgot Password
          </Heading>
          <Text color="#a5abb6" fontSize="sm" mt={1}>
            Enter your email to receive a reset code.
          </Text>
        </Box>

        {message && (
          <Box
            mb={6}
            p={3}
            bg={message.type === "error" ? "red.900" : "green.900"}
            color={message.type === "error" ? "red.200" : "green.200"}
            borderRadius="sm"
            fontSize="sm"
            border="1px solid"
          >
            {message.text}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={6}>
            <Text
              as="label"
              fontSize="xs"
              fontWeight="semibold"
              color="#a39ba9"
              textTransform="uppercase"
              display="block"
              mb={2}
            >
              Email Address
            </Text>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="architect@atelier.com"
              bg="transparent"
              border="none"
              borderBottom="2px solid"
              borderColor="#42485130"
              color="#e0e6f1"
              px={0}
              py={3}
              borderRadius="0"
              _focus={{ ring: 0, borderColor: "#c6d4f7", outline: "none" }}
            />
          </Box>
          <Button
            type="submit"
            w="full"
            bg="#c6d4f7"
            color="#0c0e11"
            fontWeight="bold"
            py={6}
            borderRadius="sm"
            _hover={{ bg: "#b8c6e8" }}
            loading={isLoading}
            loadingText="Sending..."
          >
            Send Reset Code
          </Button>
        </form>

        <Box mt={6} textAlign="center">
          <Link
            color="#a5abb6"
            fontSize="sm"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Link>
        </Box>
      </Box>
    </Flex>
  );
};

export default ForgotPassword;
