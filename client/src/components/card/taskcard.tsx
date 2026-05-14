import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/useThemeColors";
import { Draggable } from "@hello-pangea/dnd";

export interface TaskType {
  id: string;
  title: string;
  desc: string;
  priority: string;
  comments: number;
}

interface TaskCardProps {
  card: TaskType;
  index: number;
}

const TaskCard = ({ card, index }: TaskCardProps) => {
  const theme = useThemeColors();
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
      case "Urgent":
        return theme.isDark
          ? { bg: "red.900", color: "red.200" }
          : { bg: "red.100", color: "red.800" };
      case "Medium":
        return theme.isDark
          ? { bg: "orange.900", color: "orange.200" }
          : { bg: "orange.100", color: "orange.800" };
      case "Low":
        return theme.isDark
          ? { bg: "blue.900", color: "blue.200" }
          : { bg: "blue.100", color: "blue.800" };
      default:
        return theme.isDark
          ? { bg: "gray.700", color: "gray.300" }
          : { bg: "gray.200", color: "gray.700" };
    }
  };

  const pColor = getPriorityColor(card.priority);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          bg={theme.cardBg}
          p={5}
          borderRadius="md"
          transition="all 0.2s"
          border="1px solid"
          borderColor={snapshot.isDragging ? "#c6d4f7" : theme.borderCol}
          boxShadow={
            snapshot.isDragging ? "0 5px 15px rgba(0,0,0,0.2)" : "none"
          }
          transform={snapshot.isDragging ? "scale(1.02)" : "scale(1)"}
          _hover={{
            bg: theme.cardHoverBg,
            borderColor: theme.borderCol,
            shadow: theme.isDark ? "none" : "sm",
          }}
          onClick={() => navigate(`/cards/${card.id}`)}
          mb={4}
        >
          <Box mb={3}>
            <Text
              bg={pColor.bg}
              color={pColor.color}
              display="inline-block"
              fontSize="10px"
              fontWeight="extrabold"
              px={2}
              py={0.5}
              borderRadius="sm"
              textTransform="uppercase"
            >
              {card.priority}
            </Text>
          </Box>
          <Heading
            fontFamily="'Inter', sans-serif"
            fontSize="sm"
            fontWeight="semibold"
            mb={2}
          >
            {card.title}
          </Heading>
          <Text fontSize="xs" color={theme.textMuted} lineClamp={2}>
            {card.desc}
          </Text>
          <Flex
            justify="space-between"
            align="center"
            mt={4}
            pt={4}
            borderTop="1px solid"
            borderColor={theme.borderCol}
          >
            <Flex align="center" gap={1.5} color={theme.textMuted}>
              <MessageSquare size={14} />
              <Text fontSize="10px" fontWeight="bold">
                {card.comments}
              </Text>
            </Flex>
            <Text fontSize="10px" color={theme.textMuted} fontWeight="medium">
              Tarih
            </Text>
          </Flex>
        </Box>
      )}
    </Draggable>
  );
};

export default TaskCard;
