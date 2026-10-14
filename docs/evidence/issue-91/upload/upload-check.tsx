// Temporary route for the #91 device check (not committed).
import { useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { api } from "@/shared/http/api";

export default function UploadCheck() {
  const [result, setResult] = useState("not sent");
  const upload = async () => {
    // eslint-disable-next-line no-console
    console.log('UPLOAD-START', Platform.OS);
    try {
      const form = new FormData();
      form.append("title", "hello");
      const asset = require("../assets/icon.png");
      // The web gets a URL (or { uri }); native resolves the asset module.
      const uri: string =
        Platform.OS === "web"
          ? typeof asset === "string"
            ? asset
            : (asset.uri ?? asset.default)
          : Image.resolveAssetSource(asset).uri;
      if (Platform.OS === "web") {
        // On the web a file part is a Blob or File.
        form.append("avatar", await (await fetch(uri)).blob(), "icon.png");
      } else {
        form.append("avatar", {
          uri,
          name: "icon.png",
          type: "image/png",
        } as unknown as Blob);
      }
      const { data, config } = await api.post("/upload", form);
      // eslint-disable-next-line no-console
      console.log(
        "UPLOAD-SENT",
        String(config.headers["Content-Type"]),
        typeof config.data,
        config.data === form,
      );
      const parts = (
        data.parts as { name: string; png: boolean; text?: string }[]
      )
        .map((p) => `${p.name}:${p.png ? "png" : p.text}`)
        .join(",");
      setResult(
        `multipart:${data.multipart} type:${data.contentType} parts:${parts}`,
      );
    } catch (error) {
      setResult(`failed: ${String(error)}`);
    }
  };
  return (
    <View style={{ padding: 24, marginTop: 80 }}>
      <Button mode="contained" onPress={() => void upload()} testID="upload">
        Upload
      </Button>
      <Text testID="upload-result">{result}</Text>
    </View>
  );
}
