import React from 'react';
import { modules } from '../data/modules.jsx';

function ModuleList() {
  return (
    <ul className="etr-module-list">
      {modules.map((module) => (
        <li key={module.title}>
          <span className="etr-module-icon">{module.icon}</span>
          <span>{module.title}</span>
        </li>
      ))}
    </ul>
  );
}

export default ModuleList;
