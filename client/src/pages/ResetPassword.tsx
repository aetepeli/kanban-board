import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Flex, Heading, Text, Input, Button } from "@chakra-ui/react";
import { useAppDispatch } from "../hooks/redux.hooks";
import { resetPasswordUser } from "../features/auth/authSlice";

const ResetPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  // URL'den email parametresini alıyoruz
  const urlEmail = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    dispatch(resetPasswordUser({ email: urlEmail, code, newPassword }))
      .unwrap()
      .then(() => {
        setMessage({
          type: "success",
          text: "Password reset successful! Redirecting to login...",
        });
        setTimeout(() => navigate("/login"), 2500);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text: typeof err === "string" ? err : "Failed to reset password.",
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
            Set New Password
          </Heading>
          <Text color="#a5abb6" fontSize="sm" mt={1}>
            Enter the reset code sent to {urlEmail}
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
              Reset Code
            </Text>
            <Input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              bg="transparent"
              border="none"
              borderBottom="2px solid"
              borderColor="#42485130"
              color="#e0e6f1"
              px={0}
              py={3}
              borderRadius="0"
              _focus={{ ring: 0, borderColor: "#c6d4f7" }}
            />
          </Box>
          <Box mb={8}>
            <Text
              as="label"
              fontSize="xs"
              fontWeight="semibold"
              color="#a39ba9"
              textTransform="uppercase"
              display="block"
              mb={2}
            >
              New Password
            </Text>
            <Input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              bg="transparent"
              border="none"
              borderBottom="2px solid"
              borderColor="#42485130"
              color="#e0e6f1"
              px={0}
              py={3}
              borderRadius="0"
              _focus={{ ring: 0, borderColor: "#c6d4f7" }}
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
          >
            Reset Password
          </Button>
        </form>
      </Box>
    </Flex>
  );
};

export default ResetPassword;
