import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  Separator,
  Badge,
} from "@chakra-ui/react";
import { User, ShieldCheck, Smartphone, KeyRound } from "lucide-react";

import { useThemeColors } from "../theme/useThemeColors";
import { useAppDispatch, useAppSelector } from "../hooks/redux.hooks";
import {
  generate2FA,
  enable2FA,
  disable2FA,
  changePasswordUser,
} from "../features/auth/authSlice";

const Settings = () => {
  const theme = useThemeColors();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("security");

  const [profileForm, setProfileForm] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
  });

  // --- 2FA STATE'LERİ ---
  const is2FAEnabled = user?.isTfaEnabled || false;
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const [customToast, setCustomToast] = useState<{
    title: string;
    desc: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    title: string,
    desc: string,
    type: "success" | "info" | "error",
  ) => {
    setCustomToast({ title, desc, type });
    setTimeout(() => setCustomToast(null), 3000);
  };

  const handleToggleClick = async () => {
    if (is2FAEnabled) {
      setIsDisableModalOpen(true);
      setVerificationCode("");
    } else {
      setIsVerifying(true);
      try {
        const action = await dispatch(
          generate2FA({
            email: user?.email || "",
            userId: user?.id || "",
          }),
        ).unwrap();
        setQrCodeUrl(action.qrCode);
        setIsSetupModalOpen(true);
        setVerificationCode("");
      } catch (error: unknown) {
        const errMsg =
          typeof error === "string" ? error : "Could not generate QR Code";
        showToast("Error", errMsg, "error");
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length < 6) {
      showToast("Invalid Code", "Please enter a 6-digit code.", "error");
      return;
    }
    setIsVerifying(true);
    try {
      await dispatch(
        enable2FA({
          code: verificationCode,
          userId: user?.id || "",
        }),
      ).unwrap();

      setIsSetupModalOpen(false);
      showToast("Success", "2FA has been successfully enabled!", "success");
    } catch (error: unknown) {
      const errMsg =
        typeof error === "string" ? error : "Invalid verification code.";
      showToast("Error", errMsg, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (verificationCode.length < 6) {
      showToast("Invalid Code", "Please enter a 6-digit code.", "error");
      return;
    }
    setIsVerifying(true);
    try {
      await dispatch(disable2FA(verificationCode)).unwrap();
      setIsDisableModalOpen(false);
      showToast(
        "Disabled",
        "Two-factor authentication has been turned off.",
        "info",
      );
    } catch (error: unknown) {
      const errMsg =
        typeof error === "string" ? error : "Invalid verification code.";
      showToast("Error", errMsg, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveProfile = () => {
    showToast(
      "Profile Updated",
      "Your profile information has been saved.",
      "success",
    );
  };

  const handleSavePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showToast("Error", "Please fill in all password fields.", "error");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast("Error", "New passwords do not match.", "error");
      return;
    }
    if (passwords.new.length < 6) {
      showToast(
        "Error",
        "New password must be at least 6 characters.",
        "error",
      );
      return;
    }

    if (passwords.current === passwords.new) {
      showToast(
        "Error",
        "New password cannot be the same as the current password.",
        "error",
      );
      return;
    }

    setIsChangingPwd(true);
    try {
      await dispatch(
        changePasswordUser({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      ).unwrap();

      showToast(
        "Success",
        "Your password has been updated securely.",
        "success",
      );
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: unknown) {
      const errMsg =
        typeof error === "string"
          ? error
          : "Incorrect current password or server error.";
      showToast("Error", errMsg, "error");
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <Box
      p={{ base: 6, md: 12 }}
      maxW="1200px"
      mx="auto"
      minH="100vh"
      color={theme.textMain}
      fontFamily="'Inter', sans-serif"
    >
      <Box mb={10}>
        <Heading
          size="2xl"
          fontFamily="'Manrope', sans-serif"
          fontWeight="900"
          letterSpacing="tight"
          color={theme.textMain}
        >
          Account Settings
        </Heading>
        <Text color={theme.textMuted} fontSize="sm" mt={2}>
          Manage your personal information, security preferences, and
          notifications.
        </Text>
      </Box>

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={8}
        align="flex-start"
      >
        <Flex
          direction="column"
          gap={2}
          w={{ base: "100%", md: "250px" }}
          shrink={0}
        >
          {[
            { id: "profile", label: "Profile", icon: <User size={18} /> },
            {
              id: "security",
              label: "Security & 2FA",
              icon: <ShieldCheck size={18} />,
            },
          ].map((tab) => (
            <Flex
              key={tab.id}
              align="center"
              gap={3}
              p={3}
              borderRadius="md"
              cursor="pointer"
              transition="all 0.2s"
              bg={activeTab === tab.id ? theme.cardHoverBg : "transparent"}
              color={
                activeTab === tab.id
                  ? theme.isDark
                    ? "#c6d4f7"
                    : "#3182ce"
                  : theme.textMuted
              }
              fontWeight={activeTab === tab.id ? "bold" : "medium"}
              _hover={{ bg: theme.cardHoverBg, color: theme.textMain }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} <Text fontSize="sm">{tab.label}</Text>
            </Flex>
          ))}
        </Flex>

        <Box flex="1" w="full">
          {activeTab === "profile" && (
            <Box
              bg={theme.cardBg}
              p={8}
              borderRadius="xl"
              border="1px solid"
              borderColor={theme.borderCol}
              shadow={theme.isDark ? "none" : "sm"}
            >
              <Heading size="md" mb={6} color={theme.textMain}>
                Personal Information
              </Heading>
              <Flex
                gap={6}
                mb={6}
                direction={{ base: "column", sm: "row" }}
                align="center"
              >
                <Flex
                  w="80px"
                  h="80px"
                  bg={theme.avatarBg}
                  color={theme.avatarCol}
                  borderRadius="full"
                  align="center"
                  justify="center"
                  fontSize="2xl"
                  fontWeight="bold"
                  shrink={0}
                >
                  {user?.fullName?.substring(0, 2).toUpperCase() || "ME"}
                </Flex>
                <Box flex="1" w="full">
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={theme.textMuted}
                    mb={2}
                  >
                    Full Name
                  </Text>
                  <Input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    bg={theme.inputBg}
                    color={theme.textMain}
                    border="1px solid"
                    borderColor={theme.borderCol}
                    _focus={{ borderColor: "#c6d4f7" }}
                  />
                </Box>
              </Flex>
              <Box mb={8}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={theme.textMuted}
                  mb={2}
                >
                  Email Address
                </Text>
                <Input
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  bg={theme.inputBg}
                  color={theme.textMain}
                  border="1px solid"
                  borderColor={theme.borderCol}
                  _focus={{ borderColor: "#c6d4f7" }}
                />
              </Box>
              <Flex justify="flex-end">
                <Button
                  bg="#c6d4f7"
                  color="#0c0e11"
                  onClick={handleSaveProfile}
                  _hover={{ bg: "#b8c6e8" }}
                >
                  Save Changes
                </Button>
              </Flex>
            </Box>
          )}

          {activeTab === "security" && (
            <Flex direction="column" gap={8}>
              <Box
                bg={theme.cardBg}
                p={8}
                borderRadius="xl"
                border="1px solid"
                borderColor={theme.borderCol}
                shadow={theme.isDark ? "none" : "sm"}
              >
                <Flex align="center" gap={3} mb={6}>
                  <Box color="#c6d4f7">
                    <KeyRound size={24} />
                  </Box>
                  <Heading size="md" color={theme.textMain}>
                    Change Password
                  </Heading>
                </Flex>

                {/* --- 1. CURRENT PASSWORD --- */}
                <Box mb={4}>
                  <Flex justify="space-between" align="flex-end" mb={2}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={theme.textMuted}
                    >
                      Current Password
                    </Text>
                    {/* YENİ: Forgot Password Linki */}
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="#c6d4f7"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline", opacity: 0.8 }}
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot Password?
                    </Text>
                  </Flex>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    autoComplete="new-password"
                    bg={theme.inputBg}
                    color={theme.textMain}
                    border="1px solid"
                    borderColor={theme.borderCol}
                    _focus={{ borderColor: "#c6d4f7" }}
                  />
                </Box>

                {/* --- 2. NEW PASSWORD --- */}
                <Box mb={4}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={theme.textMuted}
                    mb={2}
                  >
                    New Password
                  </Text>
                  <Input
                    type="password"
                    placeholder="New strong password"
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    autoComplete="new-password"
                    bg={theme.inputBg}
                    color={theme.textMain}
                    border="1px solid"
                    borderColor={theme.borderCol}
                    _focus={{ borderColor: "#c6d4f7" }}
                  />
                </Box>

                {/* --- 3. CONFIRM NEW PASSWORD --- */}
                <Box mb={6}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={theme.textMuted}
                    mb={2}
                  >
                    Confirm New Password
                  </Text>
                  <Input
                    type="password"
                    placeholder="Confirm your new password"
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    autoComplete="new-password"
                    bg={theme.inputBg}
                    color={theme.textMain}
                    border="1px solid"
                    borderColor={theme.borderCol}
                    _focus={{ borderColor: "#c6d4f7" }}
                  />
                </Box>

                <Button
                  variant="outline"
                  borderColor={theme.borderCol}
                  color={theme.textMain}
                  _hover={{ bg: theme.cardHoverBg }}
                  onClick={handleSavePassword}
                  loading={isChangingPwd}
                  disabled={
                    !passwords.current ||
                    !passwords.new ||
                    !passwords.confirm ||
                    isChangingPwd
                  }
                >
                  Change Password
                </Button>
              </Box>

              {/* 2FA Bölümü */}
              <Box
                bg={theme.cardBg}
                p={8}
                borderRadius="xl"
                border="1px solid"
                borderColor={is2FAEnabled ? "green.500" : theme.borderCol}
                shadow={theme.isDark ? "none" : "sm"}
                position="relative"
                overflow="hidden"
              >
                {is2FAEnabled && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    w="4px"
                    h="100%"
                    bg="green.500"
                  />
                )}
                <Flex
                  justify="space-between"
                  align="flex-start"
                  direction={{ base: "column", sm: "row" }}
                  gap={4}
                  mb={6}
                >
                  <Flex gap={4}>
                    <Flex
                      w="48px"
                      h="48px"
                      bg={
                        is2FAEnabled
                          ? theme.isDark
                            ? "green.900"
                            : "green.100"
                          : theme.iconBoxBg
                      }
                      color={is2FAEnabled ? "green.500" : theme.textMuted}
                      borderRadius="lg"
                      align="center"
                      justify="center"
                      shrink={0}
                    >
                      <Smartphone size={24} />
                    </Flex>
                    <Box>
                      <Heading
                        size="md"
                        mb={1}
                        color={theme.textMain}
                        display="flex"
                        alignItems="center"
                        gap={2}
                      >
                        Two-Factor Authentication
                        {is2FAEnabled && (
                          <Badge
                            bg="green.500"
                            color="white"
                            borderRadius="full"
                            px={2}
                            fontSize="10px"
                          >
                            Active
                          </Badge>
                        )}
                      </Heading>
                      <Text color={theme.textMuted} fontSize="sm" maxW="400px">
                        Add an extra layer of security to your account. When
                        enabled, you'll need to enter a code from your
                        authenticator app.
                      </Text>
                    </Box>
                  </Flex>

                  <Flex align="center" gap={3} mt={{ base: 4, sm: 0 }}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={is2FAEnabled ? "green.500" : theme.textMuted}
                    >
                      {is2FAEnabled ? "On" : "Off"}
                    </Text>
                    <Flex
                      w="44px"
                      h="24px"
                      bg={
                        is2FAEnabled
                          ? "green.500"
                          : theme.isDark
                            ? "#424851"
                            : "#cbd5e1"
                      }
                      borderRadius="full"
                      p="2px"
                      cursor={isVerifying ? "not-allowed" : "pointer"}
                      opacity={isVerifying ? 0.7 : 1}
                      onClick={isVerifying ? undefined : handleToggleClick}
                      transition="background 0.3s"
                    >
                      <Box
                        w="20px"
                        h="20px"
                        bg="white"
                        borderRadius="full"
                        shadow="sm"
                        transform={
                          is2FAEnabled ? "translateX(20px)" : "translateX(0)"
                        }
                        transition="transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)"
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          )}
        </Box>
      </Flex>

      {isSetupModalOpen && (
        <Flex
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          backdropFilter="blur(5px)"
          zIndex="9999"
          align="center"
          justify="center"
          p={4}
        >
          <Box
            bg={theme.cardBg}
            w="100%"
            maxW="450px"
            p={8}
            borderRadius="xl"
            border="1px solid"
            borderColor={theme.borderCol}
            shadow="2xl"
            animation="scaleUp 0.2s ease-out"
          >
            <Heading
              fontFamily="'Manrope', sans-serif"
              fontSize="xl"
              mb={2}
              color={theme.textMain}
              textAlign="center"
            >
              Configure 2FA
            </Heading>
            <Text
              color={theme.textMuted}
              fontSize="sm"
              mb={6}
              textAlign="center"
            >
              Scan the QR code below with your Authenticator app (like Google
              Authenticator or Authy).
            </Text>

            <Flex justify="center" mb={6}>
              <Flex
                w="180px"
                h="180px"
                bg="white"
                borderRadius="lg"
                p={2}
                border="1px solid"
                borderColor="#e2e8f0"
                align="center"
                justify="center"
                color="#1a202c"
              >
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    width="100%"
                    height="100%"
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    Loading QR...
                  </Text>
                )}
              </Flex>
            </Flex>

            <Separator borderColor={theme.borderCol} mb={6} />

            <Box mb={6}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={theme.textMuted}
                mb={2}
                textAlign="center"
              >
                Enter the 6-digit code from your app
              </Text>
              <Input
                placeholder="e.g. 123456"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                bg={theme.inputBg}
                color={theme.textMain}
                border="1px solid"
                borderColor={theme.borderCol}
                textAlign="center"
                fontSize="xl"
                letterSpacing="widest"
                fontWeight="bold"
                h="50px"
                _focus={{
                  borderColor: "#c6d4f7",
                  ring: 1,
                  ringColor: "#c6d4f7",
                }}
              />
            </Box>

            <Flex gap={3}>
              <Button
                flex="1"
                variant="ghost"
                color={theme.textMuted}
                onClick={() => {
                  setIsSetupModalOpen(false);
                  setVerificationCode("");
                }}
                disabled={isVerifying}
                _hover={{ bg: theme.inputBg }}
              >
                Cancel
              </Button>
              <Button
                flex="1"
                bg="green.500"
                color="white"
                onClick={handleVerifyAndEnable}
                loading={isVerifying}
                loadingText="Verifying..."
                _hover={{ bg: "green.600" }}
              >
                Verify & Enable
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {isDisableModalOpen && (
        <Flex
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          backdropFilter="blur(5px)"
          zIndex="9999"
          align="center"
          justify="center"
          p={4}
        >
          <Box
            bg={theme.cardBg}
            w="100%"
            maxW="400px"
            p={8}
            borderRadius="xl"
            border="1px solid"
            borderColor={theme.borderCol}
            shadow="2xl"
          >
            <Heading size="md" mb={2} color={theme.textMain} textAlign="center">
              Disable 2FA
            </Heading>
            <Text
              color={theme.textMuted}
              fontSize="sm"
              mb={6}
              textAlign="center"
            >
              To disable Two-Factor Authentication, please enter the 6-digit
              code from your authenticator app.
            </Text>
            <Box mb={6}>
              <Input
                placeholder="e.g. 123456"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                bg={theme.inputBg}
                color={theme.textMain}
                border="1px solid"
                borderColor={theme.borderCol}
                textAlign="center"
                fontSize="xl"
                letterSpacing="widest"
                fontWeight="bold"
                h="50px"
                _focus={{ borderColor: "#c6d4f7" }}
              />
            </Box>
            <Flex gap={3}>
              <Button
                flex="1"
                variant="ghost"
                color={theme.textMuted}
                onClick={() => setIsDisableModalOpen(false)}
                _hover={{ bg: theme.inputBg }}
              >
                Cancel
              </Button>
              <Button
                flex="1"
                bg="red.500"
                color="white"
                onClick={handleDisable2FA}
                loading={isVerifying}
                _hover={{ bg: "red.600" }}
              >
                Disable 2FA
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {customToast && (
        <Box
          position="fixed"
          bottom="24px"
          right="24px"
          bg={
            customToast.type === "success"
              ? theme.isDark
                ? "green.600"
                : "green.500"
              : customToast.type === "error"
                ? theme.isDark
                  ? "red.600"
                  : "red.500"
                : theme.isDark
                  ? "#1b2027"
                  : "white"
          }
          color={
            customToast.type === "info" && !theme.isDark
              ? theme.textMain
              : "white"
          }
          border={customToast.type === "info" ? "1px solid" : "none"}
          borderColor={theme.borderCol}
          p={4}
          borderRadius="md"
          shadow="2xl"
          zIndex={10000}
        >
          <Text fontWeight="bold" fontSize="sm">
            {customToast.title}
          </Text>
          <Text
            fontSize="xs"
            mt={1}
            opacity={0.9}
            color={
              customToast.type === "info" && !theme.isDark
                ? theme.textMuted
                : "whiteAlpha.900"
            }
          >
            {customToast.desc}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Settings;
