import { Flex, Text } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity } from "lucide-react";
import { useThemeColors } from "../theme/useThemeColors";

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useThemeColors();

  const isActive = (path: string) => location.pathname.includes(path);

  const bg = theme.isDark ? "#0c0e11" : "#ffffff";
  const activeCol = theme.isDark ? "#b8c6e8" : "#3182ce";
  const activeBg = theme.isDark ? "#1b2027" : "#edf2f7";
  const hoverBg = theme.isDark ? "#161a1f" : "#f8f9fa";
  const hoverText = theme.textMain;

  return (
    <Flex
      w={isCollapsed ? "72px" : "240px"}
      h="full"
      bg={bg}
      borderRight="1px solid"
      borderColor={theme.borderCol}
      direction="column"
      py={4}
      shrink={0}
      transition="all 0.3s ease-in-out"
    >
      <Flex direction="column" gap={2} flex="1" px={isCollapsed ? 2 : 4}>
        <Flex
          align="center"
          justify={isCollapsed ? "center" : "flex-start"}
          gap={4}
          px={3}
          py={3}
          bg={isActive("/boards") ? activeBg : "transparent"}
          color={isActive("/boards") ? activeCol : theme.textMuted}
          borderRadius="md"
          cursor="pointer"
          _hover={{ bg: hoverBg, color: hoverText }}
          onClick={() => navigate("/boards")}
          title={isCollapsed ? "Boards" : ""}
        >
          <LayoutDashboard size={20} />
          {!isCollapsed && (
            <Text fontSize="sm" fontWeight="medium">
              Boards
            </Text>
          )}
        </Flex>

        <Flex
          align="center"
          justify={isCollapsed ? "center" : "flex-start"}
          gap={4}
          px={3}
          py={3}
          bg={isActive("/activity") ? activeBg : "transparent"}
          color={isActive("/activity") ? activeCol : theme.textMuted}
          borderRadius="md"
          cursor="pointer"
          _hover={{ bg: hoverBg, color: hoverText }}
          onClick={() => navigate("/activity")}
          title={isCollapsed ? "User Activities" : ""}
        >
          <Activity size={20} />
          {!isCollapsed && (
            <Text fontSize="sm" fontWeight="medium">
              User Activities
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Sidebar;
