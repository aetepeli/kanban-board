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
// YENİ: Redux hook'ları ve Thunk'lar
import { useAppDispatch, useAppSelector } from "../hooks/redux.hooks";
import { loginUser, verify2FAUser } from "../features/auth/authSlice"; // verify2FAUser'ı ekledik

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux'tan Auth durumlarını çekiyoruz
  const { isLoading, error, requires2FA, tempToken } = useAppSelector(
    (state) => state.auth,
  );

  // Form State'leri
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(loginUser({ email, password }))
      .unwrap()
      .then((res) => {
        if (!res.require2FA) {
          navigate("/boards");
        }
      })
      .catch((err) => {
        // Backend'den gelen hatayı metne çeviriyoruz
        const errorMsg = typeof err === "string" ? err : err?.message || "";

        // YENİ: Eğer hata e-posta doğrulama hatasıysa, kullanıcıyı kurtar!
        if (errorMsg.includes("verify your email")) {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      });
  };

  // 2. ADIM: 2FA Kodu Doğrulama İşlemi
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;

    // Redux'a 2FA kodunu ve geçici token'ı gönder
    dispatch(verify2FAUser({ tempToken, code: twoFaCode }))
      .unwrap()
      .then(() => {
        // Doğrulama başarılıysa panolara gönder!
        navigate("/boards");
      })
      .catch((err) => {
        console.error("2FA Error:", err);
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
        {/* Logo ve Marka */}
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
            The Digital Atelier
          </Text>
        </Box>

        {/* Giriş Kartı */}
        <Box
          w="full"
          bg="#161a1f"
          p={10}
          borderRadius="sm"
          position="relative"
          overflow="hidden"
          boxShadow="2xl"
        >
          {/* HATA MESAJI GÖSTERİMİ */}
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

          {/* EĞER 2FA İSTENİYORSA BU FORM GÖRÜNECEK */}
          {requires2FA ? (
            <form onSubmit={handleVerify2FA}>
              <Box mb={8}>
                <Heading
                  fontFamily="'Manrope', sans-serif"
                  fontSize="xl"
                  fontWeight="bold"
                  color="#e0e6f1"
                >
                  Two-Factor Authentication
                </Heading>
                <Text color="#a5abb6" fontSize="sm" mt={1}>
                  Enter the 6-digit code from your authenticator app.
                </Text>
              </Box>

              <Box mb={8}>
                <Input
                  type="text"
                  required
                  placeholder="• • • • • •"
                  value={twoFaCode}
                  onChange={(e) =>
                    setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  bg="transparent"
                  border="none"
                  borderBottom="2px solid"
                  borderColor="#42485130"
                  color="#e0e6f1"
                  px={0}
                  py={3}
                  borderRadius="0"
                  fontSize="2xl"
                  letterSpacing="widest"
                  textAlign="center"
                  _focus={{ ring: 0, borderColor: "#c6d4f7", outline: "none" }}
                />
              </Box>

              <Button
                type="submit"
                w="full"
                bg="#c6d4f7"
                color="#0c0e11"
                fontFamily="'Manrope', sans-serif"
                fontWeight="bold"
                py={6}
                borderRadius="sm"
                _hover={{ bg: "#b8c6e8" }}
                loading={isLoading}
                loadingText="Verifying..."
              >
                Verify Code
              </Button>
            </form>
          ) : (
            /* EĞER NORMAL GİRİŞSE BU FORM GÖRÜNECEK */
            <form onSubmit={handleLogin}>
              <Box mb={8}>
                <Heading
                  fontFamily="'Manrope', sans-serif"
                  fontSize="xl"
                  fontWeight="bold"
                  color="#e0e6f1"
                >
                  Welcome Back
                </Heading>
                <Text color="#a5abb6" fontSize="sm" mt={1}>
                  Access your professional workspace.
                </Text>
              </Box>

              <Box mb={6}>
                <Text
                  as="label"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="#a39ba9"
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

              <Box mb={8}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text
                    as="label"
                    fontSize="xs"
                    fontWeight="semibold"
                    color="#a39ba9"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Password
                  </Text>
                </Flex>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                <Link
                  fontSize="xs"
                  color="#c6d4f7"
                  _hover={{ color: "#d7e2ff" }}
                  mt={2}
                  display="inline-block"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </Link>
              </Box>

              <Flex direction="column" gap={4}>
                <Button
                  type="submit"
                  w="full"
                  bg="#c6d4f7"
                  color="#0c0e11"
                  fontFamily="'Manrope', sans-serif"
                  fontWeight="bold"
                  py={6}
                  borderRadius="sm"
                  _hover={{ bg: "#b8c6e8" }}
                  _active={{ transform: "scale(0.98)" }}
                  loading={isLoading}
                  loadingText="Signing In..."
                >
                  Sign In
                </Button>
              </Flex>
            </form>
          )}
        </Box>

        {/* Alt Yönlendirme (2FA Ekranında Gizle) */}
        {!requires2FA && (
          <Box mt={8}>
            <Text color="#a5abb6" fontSize="sm">
              New to the atelier?{" "}
              <Link
                color="#c6d4f7"
                fontWeight="semibold"
                onClick={() => navigate("/register")}
              >
                Register
              </Link>
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default Login;
