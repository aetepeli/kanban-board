import { useState } from "react";
import { Flex, Box, Text, Input } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  Compass,
  Sun,
  Moon,
} from "lucide-react";

import { useThemeColors } from "../theme/useThemeColors";
import { useAppSelector } from "../hooks/redux.hooks";

interface NavbarProps {
  toggleDesktopSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const Navbar = ({ toggleDesktopSidebar, toggleMobileSidebar }: NavbarProps) => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const theme = useThemeColors();

  const { user } = useAppSelector((state) => state.auth);

  const logoBg = theme.isDark ? "#1b2027" : "#edf2f7";
  const logoIconCol = theme.isDark ? "#c6d4f7" : "#3182ce";
  const dropdownBg = theme.isDark ? "#1b2027" : "#ffffff";

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      toggleMobileSidebar();
    } else {
      toggleDesktopSidebar();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "X";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <Flex
      w="full"
      h="64px"
      bg={theme.cardBg}
      borderBottom="1px solid"
      borderColor={theme.borderCol}
      align="center"
      justify="space-between"
      px={{ base: 2, md: 4 }}
      shrink={0}
      transition="background 0.3s"
    >
      <Flex align="center" gap={{ base: 2, md: 4 }}>
        <Flex
          align="center"
          justify="center"
          w="40px"
          h="40px"
          borderRadius="full"
          cursor="pointer"
          color={theme.textMuted}
          _hover={{ bg: theme.cardHoverBg, color: theme.textMain }}
          onClick={handleMenuToggle}
        >
          <Menu size={22} />
        </Flex>

        <Flex align="center" gap={3}>
          <Flex
            w={{ base: "24px", md: "28px" }}
            h={{ base: "24px", md: "28px" }}
            bg={logoBg}
            borderRadius="sm"
            align="center"
            justify="center"
            color={logoIconCol}
          >
            <Compass size={18} />
          </Flex>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color={theme.textMain}
            letterSpacing="widest"
            fontFamily="'Manrope', sans-serif"
            display={{ base: "none", sm: "block" }}
          >
            Architect
          </Text>
        </Flex>
      </Flex>

      <Flex align="center" gap={{ base: 2, md: 4 }}>
        <Box
          bg={theme.inputBg}
          px={{ base: 1, md: 3 }}
          py={1.5}
          borderRadius="sm"
          border={{ base: "none", md: "1px solid" }}
          borderColor={theme.borderCol}
          display="flex"
          alignItems="center"
        >
          <Search
            size={18}
            color={theme.textMuted}
            style={{ marginRight: "8px" }}
          />
          <Input
            variant="flushed"
            placeholder="Search..."
            size="sm"
            color={theme.textMain}
            _placeholder={{ color: theme.textMuted }}
            w={{ base: "0px", md: "150px" }}
            display={{ base: "none", md: "block" }}
          />
        </Box>

        <Flex
          cursor="pointer"
          color={theme.textMuted}
          _hover={{ color: theme.textMain, transform: "rotate(15deg)" }}
          transition="all 0.2s"
          mr={1}
          align="center"
          justify="center"
          onClick={theme.toggleTheme}
          title="Temayı Değiştir"
        >
          {theme.isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Flex>

        <Box position="relative">
          <Flex
            w={{ base: "32px", md: "36px" }}
            h={{ base: "32px", md: "36px" }}
            bg="#394763"
            color="white"
            borderRadius="full"
            align="center"
            justify="center"
            fontSize="xs"
            fontWeight="bold"
            cursor="pointer"
            border="2px solid"
            borderColor={isProfileMenuOpen ? logoIconCol : "transparent"}
            transition="all 0.2s"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            {getInitials(user?.fullName)}
          </Flex>

          {isProfileMenuOpen && (
            <>
              <Box
                position="fixed"
                top="0"
                left="0"
                w="100vw"
                h="100vh"
                zIndex="998"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <Box
                position="absolute"
                top={{ base: "110%", md: "120%" }}
                right="0"
                w="200px"
                bg={dropdownBg}
                borderRadius="md"
                border="1px solid"
                borderColor={theme.borderCol}
                shadow="xl"
                zIndex="999"
                overflow="hidden"
                py={2}
              >
                <Box
                  px={4}
                  py={2}
                  borderBottom="1px solid"
                  borderColor={theme.borderCol}
                  mb={2}
                >
                  <Text color={theme.textMain} fontSize="sm" fontWeight="bold">
                    {user?.fullName || "Kullanıcı"}
                  </Text>
                  <Text color={theme.textMuted} fontSize="xs">
                    {user?.email || "email@bulunamadi.com"}
                  </Text>
                </Box>

                <Flex
                  align="center"
                  gap={3}
                  px={4}
                  py={2}
                  color={theme.textMuted}
                  cursor="pointer"
                  _hover={{ bg: theme.cardHoverBg, color: theme.textMain }}
                >
                  <User size={16} /> <Text fontSize="sm">My Profile</Text>
                </Flex>

                <Flex
                  align="center"
                  gap={3}
                  px={4}
                  py={2}
                  color={theme.textMuted}
                  cursor="pointer"
                  _hover={{ bg: theme.cardHoverBg, color: theme.textMain }}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  <Settings size={16} /> <Text fontSize="sm">Settings</Text>
                </Flex>

                <Box
                  borderTop="1px solid"
                  borderColor={theme.borderCol}
                  my={2}
                />

                <Flex
                  align="center"
                  gap={3}
                  px={4}
                  py={2}
                  color="#ee7d77"
                  cursor="pointer"
                  _hover={{ bg: theme.isDark ? "#7f292720" : "#fff5f5" }}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    localStorage.removeItem("token");
                    navigate("/login");
                  }}
                >
                  <LogOut size={16} />{" "}
                  <Text fontSize="sm" fontWeight="medium">
                    Sign Out
                  </Text>
                </Flex>
              </Box>
            </>
          )}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Navbar;
