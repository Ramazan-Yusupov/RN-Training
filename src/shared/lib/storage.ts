import AsyncStorage from "@react-native-async-storage/async-storage";

/** AsyncStorage хранит только гостевые данные. Сессия аккаунта позже будет в SecureStore. */
export const guestStorage = AsyncStorage;
