import Router from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import cls from 'classnames';
import { Layout, Nav, Space, Button, Typography, Skeleton, Tooltip, Popover, BackTop, Spin } from '@douyinfe/semi-ui';
import { IconEdit, IconArticle } from '@douyinfe/semi-icons';
import { Seo } from 'components/seo';
import { DataRender } from 'components/data-render';
import { DocumentShare } from 'components/document/share';
import { DocumentStar } from 'components/document/star';
import { DocumentCollaboration } from 'components/document/collaboration';
import { DocumentStyle } from 'components/document/style';
import { DocumentVersion } from 'components/document/version';
import { CommentEditor } from 'components/document/comments';
import { useDocumentStyle } from 'hooks/use-document-style';
import { useWindowSize } from 'hooks/use-window-size';
import { useUser } from 'data/user';
import { useDocumentDetail } from 'data/document';
import { triggerJoinUser } from 'event';
import { CollaborationEditor } from 'tiptap/editor';
import { Author } from './author';
import styles from './index.module.scss';

const { Header } = Layout;
const { Text } = Typography;
const EditBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 30,
  width: 30,
  borderRadius: '100%',
  backgroundColor: '#0077fa',
  color: '#fff',
  right: 16,
  bottom: 70,
  transform: 'translateY(-50px)',
};

interface IProps {
  documentId: string;
}

export const DocumentReader: React.FC<IProps> = ({ documentId }) => {
  const [container, setContainer] = useState<HTMLDivElement>();
  const { width: windowWidth, isMobile } = useWindowSize();
  const { width, fontSize } = useDocumentStyle();
  const editorWrapClassNames = useMemo(() => {
    return width === 'standardWidth' ? styles.isStandardWidth : styles.isFullWidth;
  }, [width]);
  const { user } = useUser();
  const { data: documentAndAuth, loading: docAuthLoading, error: docAuthError } = useDocumentDetail(documentId);
  const { document, authority } = documentAndAuth || {};

  const renderAuthor = useCallback(
    (element) => {
      if (!document) return null;

      const target = element && element.querySelector('.ProseMirror .title');

      if (target) {
        return createPortal(<Author document={document} />, target);
      }

      return null;
    },
    [document]
  );

  const gotoEdit = useCallback(() => {
    Router.push(`/wiki/${document.wikiId}/document/${document.id}/edit`);
  }, [document]);

  const actions = useMemo(
    () => (
      <Space>
        {document && authority.readable && (
          <DocumentCollaboration key="collaboration" wikiId={document.wikiId} documentId={documentId} />
        )}
        {authority && authority.editable && (
          <Tooltip key="edit" content="编辑" position="bottom">
            <Button icon={<IconEdit />} onMouseDown={gotoEdit} />
          </Tooltip>
        )}
        {authority && authority.readable && (
          <>
            <DocumentShare key="share" documentId={documentId} />
            <DocumentVersion key="version" documentId={documentId} />
            <DocumentStar key="star" documentId={documentId} />
          </>
        )}
        <Popover key="style" zIndex={1061} position={isMobile ? 'topRight' : 'bottomLeft'} content={<DocumentStyle />}>
          <Button icon={<IconArticle />} theme="borderless" type="tertiary" />
        </Popover>
      </Space>
    ),
    [document, documentId, authority, isMobile, gotoEdit]
  );

  if (!documentId) return null;

  return (
    <div className={styles.wrap}>
      <Header className={styles.headerWrap}>
        <Nav
          style={{ overflow: 'auto', paddingLeft: 0, paddingRight: 0 }}
          mode="horizontal"
          header={
            <DataRender
              loading={docAuthLoading}
              error={docAuthError}
              loadingContent={<Skeleton active placeholder={<Skeleton.Title style={{ width: 80 }} />} loading={true} />}
              normalContent={() => (
                <Text
                  strong
                  ellipsis={{
                    showTooltip: { opts: { content: document.title, style: { wordBreak: 'break-all' } } },
                  }}
                  style={{ width: isMobile ? windowWidth - 100 : ~~(windowWidth / 4) }}
                >
                  {document.title}
                </Text>
              )}
            />
          }
          footer={isMobile ? <></> : actions}
        ></Nav>
      </Header>
      <Layout className={styles.contentWrap}>
        <div ref={setContainer}>
          <div className={cls(styles.editorWrap, editorWrapClassNames)} style={{ fontSize }}>
            <DataRender
              loading={docAuthLoading}
              error={docAuthError}
              loadingContent={
                <div style={{ margin: '10vh auto' }}>
                  <Spin tip="正在为您读取文档中...">
                    {/* FIXME: semi-design 的问题，不加 div，文字会换行! */}
                    <div></div>
                  </Spin>
                </div>
              }
              normalContent={() => {
                return (
                  <>
                    <Seo title={document.title} />
                    {user && (
                      <CollaborationEditor
                        editable={false}
                        user={user}
                        id={documentId}
                        type="document"
                        renderInEditorPortal={renderAuthor}
                        onAwarenessUpdate={triggerJoinUser}
                      />
                    )}
                    {user && (
                      <div className={styles.commentWrap}>
                        <CommentEditor documentId={document.id} />
                      </div>
                    )}
                    {!isMobile && authority && authority.editable && container && (
                      <BackTop style={EditBtnStyle} onClick={gotoEdit} target={() => container} visibilityHeight={200}>
                        <IconEdit />
                      </BackTop>
                    )}
                    {container && <BackTop style={{ bottom: 65, right: 16 }} target={() => container} />}
                  </>
                );
              }}
            />
          </div>
        </div>
      </Layout>
      {isMobile && <div className={styles.mobileToolbar}>{actions}</div>}
    </div>
  );
};
