import { notFound } from "next/navigation";
import Demo from "./demo";
import "../../dashboard/studio.css";
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Demo />;
}
