import LabelWithPopover from "./qubic/ui/LabelWithPopover"

const LabelData = ({lbl, value, description}) => (
  <div className="flex flex-col justify-center items-center">
    {description ? (
      <LabelWithPopover
        label={lbl}
        description={description}
      />
    ) : (<span className="text-gray-50 text-12">
      {lbl}
    </span>)}
    <span className="text-white text-16">
      {value}
    </span>
  </div>
)

export default LabelData
