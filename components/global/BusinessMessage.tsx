import React from "react";

type Props = {
  title: string;
  message: string;
  children?: React.ReactNode;
};
const BusinessMessage = ({ title, message, children }: Props) => {
  return (
    <div className="flex flex-col justify-center items-center w-full max-w-md space-y-3">
      <h1 className="text-2xl font-semibold text-center">{title}</h1>

      <div className="flex w-full justify-center items-center">{children}</div>
      <p className="  text-center text-muted-foreground">{message}</p>
    </div>
  );
};

export default BusinessMessage;
