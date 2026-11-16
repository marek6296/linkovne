import { notFound } from "next/navigation";
import Studio from "./studio";
export const metadata = {
  title: "Linkovne · Premium studio",
  robots: { index: false, follow: false },
};
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Studio />;
}
