import { Loader2 } from "lucide-react";

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="loader-container">
      <Loader2 className="loader-icon" size={32} />
      <p>{text}</p>
    </div>
  );
};

export default Loader;