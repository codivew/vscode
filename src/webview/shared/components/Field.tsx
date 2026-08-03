/** @jsxImportSource react */
import React from 'react';
import styles from './Field.module.css';

const Field = ({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element => {
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
};

export default Field;
