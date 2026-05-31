'use client'

import { Card, Row, Col, Skeleton } from 'antd'

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, index) => (
        <Col xs={24} sm={12} md={8} key={index}>
          <Card>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 mb-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input
              key={colIndex}
              active
              style={{ flex: 1 }}
              size="small"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, index) => (
        <Col xs={12} sm={6} key={index}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="p-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="mb-4">
          <Skeleton.Input active style={{ width: '100%' }} />
        </div>
      ))}
      <Skeleton.Button active style={{ width: '100%', height: 40 }} />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="p-8">
      <Skeleton.Input active style={{ width: 300, height: 40, marginBottom: 24 }} />
      <Skeleton.Input active style={{ width: 500, marginBottom: 24 }} />
      <CardSkeleton count={3} />
    </div>
  )
}
