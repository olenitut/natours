import axios from "axios";
import { showAlert } from "./alerts";

export const updateSettigns = async (data, type) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: `/api/v1/users/${
        type === "password" ? "updatePassword" : "updateMe"
      }`,
      data,
    });

    if (res.data.status === "success") {
      showAlert(
        "success",
        `${type === "password" ? "Password" : "Data"} changed successfully`
      );
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
