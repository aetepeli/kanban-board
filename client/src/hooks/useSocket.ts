import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "./redux.hooks";
import {
  moveCardSocket,
  createColumnSocket,
  deleteColumnSocket,
  createCardSocket,
  deleteCardSocket,
} from "../features/boards/boardSlice";
const SOCKET_URL = import.meta.env.BASE_URL || "http://localhost:5000";

export const useSocket = (boardId: string | undefined) => {
  const socket = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const userId = user?.id;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    console.log("Socket Değerleri Kontrolü:", { boardId, userId, token });

    if (!boardId || !userId || !token) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    s.on("connect", () => {
      console.log("SOKET BAĞLANDI! ID:", s.id);
      s.emit("join_board", { boardId });
    });

    s.on("connect_error", (err) => {
      console.error("BAĞLANTI HATASI:", err.message);
    });

    s.on("error", (err) => {
      console.error("BACKENDDEN HATA GELDİ:", err);
    });

    s.on("card_moved", (data) => {
      console.log("FRONTEND: Soketten mesaj yakalandı!", data);

      dispatch(
        moveCardSocket({
          cardId: data.cardId,
          fromColumnId: data.fromColumnId,
          toColumnId: data.toColumnId,
          newIndex: data.newOrder,
        }),
      );
    });

    s.on("column_created", (data) => {
      dispatch(createColumnSocket(data.column));
    });

    s.on("column_deleted", (data) => {
      dispatch(deleteColumnSocket({ columnId: data.columnId }));
    });

    s.on("card_created", (data) => {
      dispatch(createCardSocket({ columnId: data.columnId, card: data.card }));
    });

    s.on("card_deleted", (data) => {
      dispatch(
        deleteCardSocket({ columnId: data.columnId, cardId: data.cardId }),
      );
    });

    socket.current = s;

    return () => {
      s.disconnect();
    };
  }, [boardId, dispatch, userId]);

  return socket;
};
