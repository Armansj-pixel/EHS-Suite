import PTWForm from "./PTWForm";

export const metadata = { title: "Buat PTW" };

export default function NewPTWPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Permit to Work – Form Baru</h1>
      <PTWForm />
    </div>
  );
}