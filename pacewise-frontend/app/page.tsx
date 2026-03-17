import { redirect } from "next/navigation";

export default function RootRedirectPage() {
  // Default to the marketing landing page
  redirect("/landing");
}
