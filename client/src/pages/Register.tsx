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
  SimpleGrid,
} from "@chakra-ui/react";

import { useAppDispatch } from "../hooks/redux.hooks";
import { registerUser } from "../features/auth/authSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Form Verileri
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Durum Yönetimi
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
      setError("Şifreler birbiriyle eşleşmiyor!");
      return;
    }

    setIsLoading(true);

    dispatch(registerUser({ fullName, email, password }))
      .unwrap()
      .then(() => {
        setIsLoading(false);
        // Axios zaten hata olursa catch'e atacağı için burada success aramıyoruz!
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      })
      .catch((err) => {
        setIsLoading(false);
        // Backend'den gelen hatayı güvenle ekrana basıyoruz
        setError(
          typeof err === "string"
            ? err
            : err?.message || "Bu e-posta zaten kullanımda.",
        );
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
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Box mb={12} textAlign="center">
          <Heading
            fontFamily="'Manrope', sans-serif"
            fontSize="2xl"
            fontWeight="extrabold"
            letterSpacing="widest"
            color="#c6d4f7"
            textTransform="uppercase"
          >
            Architect Kanban
          </Heading>
          <Text color="#a39ba9" fontSize="sm" mt={2}>
            The Digital Atelier for Modern Strategy
          </Text>
        </Box>

        <Box w="full" bg="#161a1f" p={10} borderRadius="md" boxShadow="2xl">
          <Box mb={8}>
            <Heading
              fontFamily="'Manrope', sans-serif"
              fontSize="xl"
              fontWeight="bold"
              color="#e0e6f1"
            >
              Create Account
            </Heading>
            <Text color="#a5abb6" fontSize="sm" mt={1}>
              Join the workspace to manage your architectural vision.
            </Text>
          </Box>

          {/* HATA MESAJI */}
          {error && (
            <Box
              mb={6}
              p={3}
              bg="red.900"
              color="red.200"
              borderRadius="sm"
              fontSize="sm"
              border="1px solid"
              borderColor="red.700"
            >
              {error}
            </Box>
          )}

          <form onSubmit={handleRegister}>
            <Box mb={5}>
              <Text
                as="label"
                fontSize="xs"
                fontWeight="semibold"
                color="#a5abb6"
                textTransform="uppercase"
                letterSpacing="wider"
                display="block"
                mb={2}
              >
                Full Name
              </Text>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Le Corbusier"
                bg="#0c0e11"
                border="1px solid"
                borderColor="#42485150"
                color="#e0e6f1"
                px={4}
                py={3}
                _focus={{ borderColor: "#c6d4f7", outline: "none" }}
              />
            </Box>

            <Box mb={5}>
              <Text
                as="label"
                fontSize="xs"
                fontWeight="semibold"
                color="#a5abb6"
                textTransform="uppercase"
                letterSpacing="wider"
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
                placeholder="atelier@architecture.com"
                bg="#0c0e11"
                border="1px solid"
                borderColor="#42485150"
                color="#e0e6f1"
                px={4}
                py={3}
                _focus={{ borderColor: "#c6d4f7", outline: "none" }}
              />
            </Box>

            <SimpleGrid columns={2} gap={4} mb={8}>
              <Box>
                <Text
                  as="label"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="#a5abb6"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  display="block"
                  mb={2}
                >
                  Password
                </Text>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="#0c0e11"
                  border="1px solid"
                  borderColor="#42485150"
                  color="#e0e6f1"
                  px={4}
                  py={3}
                  _focus={{ borderColor: "#c6d4f7", outline: "none" }}
                />
              </Box>
              <Box>
                <Text
                  as="label"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="#a5abb6"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  display="block"
                  mb={2}
                >
                  Confirm
                </Text>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  bg="#0c0e11"
                  border="1px solid"
                  borderColor="#42485150"
                  color="#e0e6f1"
                  px={4}
                  py={3}
                  _focus={{ borderColor: "#c6d4f7", outline: "none" }}
                />
              </Box>
            </SimpleGrid>

            <Button
              type="submit"
              w="full"
              bg="#c6d4f7"
              color="#0c0e11"
              fontFamily="'Manrope', sans-serif"
              fontWeight="bold"
              py={6}
              borderRadius="sm"
              loading={isLoading}
              loadingText="Creating..."
              _hover={{ bg: "#b8c6e8" }}
              _active={{ transform: "scale(0.98)" }}
            >
              Create Account
            </Button>
          </form>

          <Box
            mt={8}
            pt={8}
            borderTop="1px solid"
            borderColor="#42485120"
            textAlign="center"
          >
            <Text fontSize="sm" color="#a5abb6">
              Already a member?{" "}
              <Link
                color="#c6d4f7"
                fontWeight="semibold"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Link>
            </Text>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Register;
