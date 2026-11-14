import { useState } from 'react';
import { club } from '../config';
import { downloadDocument } from '../lib/download';
import { DownloadButton } from './UI';

export function MemberCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="member-card-area">
      <button
        className={`member-card ${flipped ? 'is-flipped' : ''}`}
        aria-label={flipped ? 'Ver frente do cartão de sócio' : 'Ver verso do cartão de sócio'}
        aria-pressed={flipped}
        onClick={() => setFlipped(!flipped)}
      >
        <span className="card-face card-front">
          <span className="card-top">
            <span className="wordmark">D&B.</span>
            <span>CLUBE PRIVADO</span>
          </span>
          <span className="card-rule" />
          <span className="card-category">CONVIDADO DE HONRA</span>
          <span className="card-name">{club.member.toUpperCase()}</span>
          <span className="card-bottom">
            <span>
              SÓCIO N.º {club.memberNumber}
              <small>Estado: Admitido</small>
            </span>
            <span>
              Direção: {club.director}
              <small>DESDE 2026</small>
            </span>
          </span>
        </span>
        <span className="card-face card-back">
          <span className="wordmark">D&B.</span>
          <span>{club.cardBack}</span>
          <small>EM CASO DE PERDA, FAZ OLHINHOS AO DIRETOR.</small>
        </span>
      </button>
      <div className="card-controls">
        <span className="aside">Toca no cartão para o virar.</span>
        <DownloadButton
          onDownload={() =>
            downloadDocument(
              'BEN',
              [
                { label: 'Sócio', value: `N.º ${club.memberNumber}` },
                { label: 'Categoria', value: 'Convidado de Honra' },
                { label: 'Estado', value: 'Admitido' },
                { label: 'Direção', value: club.director },
              ],
              'DB-cartao-Ben.png',
              club.cardBack,
            )
          }
        >
          Guardar cartão · PNG
        </DownloadButton>
      </div>
    </div>
  );
}
