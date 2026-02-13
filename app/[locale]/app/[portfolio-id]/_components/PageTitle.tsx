type Props = {
  text: string;
};

const PageTitle = (props: Props) => {
  return <h1 className="text-2xl font-bold">{props.text}</h1>;
};

export default PageTitle;
