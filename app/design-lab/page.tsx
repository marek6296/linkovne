import { notFound } from "next/navigation";
import Lab from "./lab";
export const metadata = { title: "Linkovne · Design lab", robots: { index: false, follow: false } };
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Lab />;
}
