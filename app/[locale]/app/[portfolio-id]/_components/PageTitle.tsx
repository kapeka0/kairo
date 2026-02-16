type Props = {
  text: string;
};

const PageTitle = ({ text }: Props) => {
  return <h1 className="text-3xl font-bold ">{text}</h1>;
};

export default PageTitle;
