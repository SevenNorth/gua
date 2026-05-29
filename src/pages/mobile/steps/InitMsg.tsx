import { ReactNode } from 'react';
import GuaIntro from '../../../components/GuaIntro';

const InitMsg = (props: { children?: ReactNode }) => {
    const { children } = props;

    return (
        <>
            <GuaIntro />
            {children}
        </>
    );
};

export default InitMsg;
