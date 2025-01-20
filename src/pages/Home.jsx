import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-4xl font-bold mb-6 text-primary">Welcome to SplitLy</h1>
      <p className="text-lg text-gray-600 mb-8">
        Simplify group expenses. Upload receipts, assign items, and settle payments easily!
      </p>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Link
          to="/login"
          className="py-3 px-6 bg-primary text-white rounded hover:bg-secondary text-lg transition"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="py-3 px-6 bg-secondary text-primary rounded hover:bg-gray-300 text-lg transition"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
