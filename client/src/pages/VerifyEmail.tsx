import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Icon,
} from "@chakra-ui/react";
import { Mail, RefreshCw } from "lucide-react";

import { useAppDispatch } from "../hooks/redux.hooks";
import {
  verifyEmailUser,
  resendVerification,
} from "../features/auth/authSlice";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!email) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/auth/check-verified?email=${email}`);
        const data = await res.json();
        if (data.data?.isEmailVerified) {
          clearInterval(interval);
          navigate("/login?verified=true", { replace: true });
        }
      } catch {
        // silent
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleVerify = () => {
    if (code.length !== 6) {
      setError("Lütfen 6 haneli kodu eksiksiz girin.");
      return;
    }

    setError(null);
    setIsLoading(true);

    dispatch(verifyEmailUser({ email, code }))
      .unwrap()
      .then(() => {
        setIsLoading(false);
        setSuccessMsg(
          "Hesabınız başarıyla doğrulandı! Yönlendiriliyorsunuz...",
        );

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      })
      .catch((err) => {
        setIsLoading(false);
        setError(err);
      });
  };

  const handleResend = () => {
    if (countdown > 0) return;

    setError(null);
    setSuccessMsg(null);

    dispatch(resendVerification(email))
      .unwrap()
      .then(() => {
        setSuccessMsg("Yeni doğrulama kodu e-postanıza gönderildi.");
        setCountdown(90);
      })
      .catch((err) => {
        setError(err);
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
        <Flex
          w="64px"
          h="64px"
          bg="#161a1f"
          borderRadius="full"
          align="center"
          justify="center"
          mb={6}
          border="1px solid"
          borderColor="#42485150"
        >
          <Icon as={Mail} color="#c6d4f7" boxSize={6} />
        </Flex>

        <Heading
          fontFamily="'Manrope', sans-serif"
          fontSize="2xl"
          fontWeight="extrabold"
          color="#e0e6f1"
          mb={4}
        >
          Check your email
        </Heading>

        <Text color="#a5abb6" fontSize="sm" textAlign="center" mb={8} px={4}>
          We sent a 6-digit verification code to{" "}
          <Text as="span" fontWeight="bold" color="#c6d4f7">
            {email}
          </Text>
          . Enter the code below or click the magic link in the email to sign in
          automatically.
        </Text>

        {error && (
          <Box
            mb={6}
            p={3}
            w="full"
            bg="red.900"
            color="red.200"
            borderRadius="sm"
            fontSize="sm"
            textAlign="center"
            border="1px solid"
            borderColor="red.700"
          >
            {error}
          </Box>
        )}
        {successMsg && (
          <Box
            mb={6}
            p={3}
            w="full"
            bg="green.900"
            color="green.200"
            borderRadius="sm"
            fontSize="sm"
            textAlign="center"
            border="1px solid"
            borderColor="green.700"
          >
            {successMsg}
          </Box>
        )}

        <Box w="full" bg="#161a1f" p={8} borderRadius="md" boxShadow="2xl">
          <Flex justify="center" mb={8}>
            <Input
              type="text"
              required
              placeholder="• • • • • •"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={isLoading || !!successMsg}
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
          </Flex>

          <Button
            w="full"
            bg="#c6d4f7"
            color="#0c0e11"
            fontFamily="'Manrope', sans-serif"
            fontWeight="bold"
            py={6}
            borderRadius="sm"
            onClick={handleVerify}
            loading={isLoading}
            loadingText="Verifying..."
            disabled={code.length !== 6 || !!successMsg}
            _hover={{ bg: "#b8c6e8" }}
            _active={{ transform: "scale(0.98)" }}
            mb={6}
          >
            Verify Email →
          </Button>

          <Flex justify="center" align="center" gap={2}>
            <Text fontSize="sm" color="#a5abb6">
              Didn't receive the email?
            </Text>

            <Button
              variant="ghost"
              color={countdown > 0 ? "#424851" : "#c6d4f7"}
              fontSize="sm"
              fontWeight="semibold"
              onClick={handleResend}
              disabled={countdown > 0}
              _hover={{
                textDecoration: countdown > 0 ? "none" : "underline",
                bg: "transparent",
              }}
              px={2}
              h="auto"
              minW="auto"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
            </Button>
          </Flex>

          <Flex justify="center" align="center" mt={8} gap={2} opacity={0.6}>
            <Icon as={RefreshCw} color="#a5abb6" boxSize={3} />
            <Text fontSize="xs" color="#a5abb6">
              Waiting for magic link confirmation...
            </Text>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default VerifyEmail;
