import { useAlert } from "react-alert";
import { useEffect } from "react";

export const useErrorAlert = (error: Error | null | undefined) => {
  const Alert = useAlert();
  useEffect(() => {
    if (error instanceof Error) {
      Alert.error(error.message);
    } else if (error) {
      Alert.error("An unknown error occurred");
    }
  }, [error?.message]);
};
