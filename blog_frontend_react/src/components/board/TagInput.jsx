import React, { useState } from "react";
import "./TagInput.css";

const TagInput = ({ tags, setTags }) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedInput = input.trim();

      if (trimmedInput && !tags.includes(trimmedInput)) {
        setTags([...tags, trimmedInput]);
        setInput("");
      }
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="tag-input-container">
      <ul className="tag-list">
        {tags.map((tag, index) => (
          <li key={index} className="tag-item">
            <span>#{tag}</span>
            <button
              type="button"
              className="tag-remove-btn"
              onClick={() => removeTag(index)}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        className="tag-input-filed"
        placeholder="태그를 입력하고 엔터를 누르세요"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
export default TagInput;
