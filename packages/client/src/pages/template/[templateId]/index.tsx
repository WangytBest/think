import { TemplateEditor } from 'components/template/editor';
import { NextPage } from 'next';

interface IProps {
  templateId: string;
}

const Page: NextPage<IProps> = ({ templateId }) => {
  return <TemplateEditor templateId={templateId} />;
};

Page.getInitialProps = async (ctx) => {
  const { templateId } = ctx.query;
  return { templateId } as IProps;
};

export default Page;
