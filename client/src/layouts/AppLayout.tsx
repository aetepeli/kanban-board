import { useState } from "react";
import { Flex, Box } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useThemeColors } from "../theme/useThemeColors";

const AppLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { mainBg } = useThemeColors();

  return (
    <Flex
      direction="column"
      h="100vh"
      w="100vw"
      bg={mainBg}
      overflow="hidden"
      transition="background 0.3s"
    >
      <Navbar
        toggleDesktopSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        toggleMobileSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <Flex flex="1" overflow="hidden" position="relative">
        <Box display={{ base: "none", md: "block" }}>
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </Box>

        <Box
          display={{ base: "block", md: "none" }}
          position="absolute"
          top="0"
          left={isMobileMenuOpen ? "0" : "-100%"}
          h="100%"
          zIndex="1000"
          transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          boxShadow={isMobileMenuOpen ? "xl" : "none"}
        >
          <Sidebar isCollapsed={false} />
        </Box>

        {isMobileMenuOpen && (
          <Box
            display={{ base: "block", md: "none" }}
            position="absolute"
            inset="0"
            bg="blackAlpha.700"
            zIndex="999"
            backdropFilter="blur(2px)"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <Box flex="1" overflowY="auto" position="relative" w="full">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default AppLayout;
