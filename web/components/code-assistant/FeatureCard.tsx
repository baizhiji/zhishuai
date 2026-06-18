import React from 'react';
import { Card } from 'antd';
import { 
  CodeOutlined, 
  SearchOutlined, 
  BugOutlined, 
  CheckSquareOutlined, 
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDeveloperMode: boolean;
  onClick: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  generate: <CodeOutlined />,
  explain: <SearchOutlined />,
  debug: <BugOutlined />,
  testgen: <CheckSquareOutlined />,
  review: <EyeOutlined />,
  nl2code: <ThunderboltOutlined />,
};

export default function FeatureCard(props: FeatureCardProps) {
  const { icon, title, description, isDeveloperMode, onClick } = props;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      hoverable
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl text-blue-500">
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-800 mb-1">
            {title}
          </div>
          <div className="text-sm text-gray-500">
            {description}
          </div>
        </div>
      </div>
    </Card>
  );
}

export { iconMap };
