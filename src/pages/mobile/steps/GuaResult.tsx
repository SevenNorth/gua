import { Divider, Typography } from 'antd';
import GuaExplain from '../../../components/GuaExplain';
import GuaGraph from '../../../components/GuaGraph';
import { useGuaExplain } from '../../../hooks/useGuaExplain';
import { guaCodeToDisplayLines } from '../../../utils/gua';

const GuaResult = (props: { guaStr: string | undefined }) => {
    const { guaStr } = props;
    const { error, guaResult, loading } = useGuaExplain(guaStr);
    const gua = guaStr ? guaCodeToDisplayLines(guaStr) : [];

    return (
        <div className="explainBox">
            <GuaGraph gua={gua} />
            <Divider orientation="left">解卦</Divider>
            {!guaStr ? (
                <Typography.Paragraph>
                    <Typography.Text type="danger">
                        未找到起卦结果，请重新起卦。
                    </Typography.Text>
                </Typography.Paragraph>
            ) : (
                <GuaExplain
                    error={error}
                    guaResult={guaResult}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default GuaResult;
