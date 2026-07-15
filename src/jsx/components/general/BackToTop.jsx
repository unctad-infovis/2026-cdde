import './BackToTop.css';

const BackToTop = ({ selector }) => {
  const onClick = () => {
    window.appRef.current.querySelector(selector)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="container_back_to_top">
      <button aria-label="Back to top" type="button" onClick={onClick}>
        Back to top
      </button>
    </div>
  );
};

export default BackToTop;
